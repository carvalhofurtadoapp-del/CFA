const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const VAPID_PUBLIC_KEY = 'BCInmnJAyqh14yN_povOfWlqOFgsO7D1aZog9MFjo7G1gAFvXtAQq84y_Am5HgaC_tO9P8UYagVqRcXsoBC2FEA'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if this is a manual test
    let body: any = {}
    try { body = await req.json() } catch { /* empty body ok */ }

    const alerts: { title: string; body: string; tag: string; url: string }[] = []

    if (body?.test) {
      // Manual test notification
      alerts.push({
        title: '🔔 Teste CFA',
        body: 'As notificações estão funcionando corretamente!',
        tag: 'test-notification',
        url: '/',
      })
    } else {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const todayStr = today.toISOString().split('T')[0]
      const nextWeekStr = nextWeek.toISOString().split('T')[0]

      // 1. Check animals needing weaning (7+ months)
      const { data: animais } = await supabase
        .from('animais')
        .select('id, brinco, nome, data_nascimento, data_desmama, status')
        .eq('status', 'ativo')
        .is('data_desmama', null)

      if (animais) {
        for (const a of animais) {
          const birth = new Date(a.data_nascimento)
          const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
          if (months >= 7) {
            alerts.push({
              title: '🍼 Desmama Necessária',
              body: `${a.nome || a.brinco} atingiu ${months} meses. Hora da desmama!`,
              tag: `desmama-${a.id}`,
              url: '/rebanho',
            })
          }
        }
      }

      // 2. Check vaccines due soon (next 7 days)
      const { data: vacinas } = await supabase
        .from('vacinas')
        .select('id, nome, data_proxima, animal_id, animais!inner(brinco, nome)')
        .eq('status', 'pendente')
        .gte('data_proxima', todayStr)
        .lte('data_proxima', nextWeekStr)

      if (vacinas) {
        for (const v of vacinas as any[]) {
          const animal = v.animais
          alerts.push({
            title: '💉 Vacina Próxima',
            body: `${v.nome} para ${animal?.nome || animal?.brinco} vence em ${v.data_proxima}`,
            tag: `vacina-${v.id}`,
            url: '/veterinaria',
          })
        }
      }

      // 3. Check low stock items
      const { data: insumos } = await supabase
        .from('insumos')
        .select('id, nome, quantidade, minimo')

      if (insumos) {
        for (const i of insumos) {
          if (i.quantidade <= i.minimo) {
            alerts.push({
              title: '📦 Estoque Baixo',
              body: `${i.nome}: ${i.quantidade} restantes (mínimo: ${i.minimo})`,
              tag: `estoque-${i.id}`,
              url: '/deposito',
            })
          }
        }
      }

      // 4. Check equipment maintenance due
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('id, nome, proxima_manutencao')
        .eq('status', 'ativo')
        .not('proxima_manutencao', 'is', null)
        .lte('proxima_manutencao', nextWeekStr)

      if (equipamentos) {
        for (const e of equipamentos) {
          alerts.push({
            title: '🔧 Manutenção Programada',
            body: `${e.nome}: manutenção prevista para ${e.proxima_manutencao}`,
            tag: `manutencao-${e.id}`,
            url: '/equipamentos',
          })
        }
      }
    }

    if (alerts.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum alerta encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum dispositivo registrado', alerts: alerts.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Configure web-push
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY || '',
      VAPID_PRIVATE_KEY,
    )

    // Send notifications
    const expiredEndpoints: string[] = []
    let sent = 0

    for (const alert of alerts) {
      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }
          
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(alert),
            { TTL: 86400 }
          )
          sent++
        } catch (err: any) {
          console.error('Push send error:', err?.statusCode, err?.body || err?.message)
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint)
          }
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    return new Response(
      JSON.stringify({
        alerts: alerts.length,
        subscriptions: subscriptions.length,
        sent,
        expired_cleaned: expiredEndpoints.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
