import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Apple, Utensils, TrendingUp } from 'lucide-react';
import DietasTab from '@/components/nutricao/DietasTab';
import ConsumoTab from '@/components/nutricao/ConsumoTab';
import DesempenhoTab from '@/components/nutricao/DesempenhoTab';

export default function NutricaoPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Nutrição</h1>
        <p className="text-sm text-muted-foreground mt-1">Controle completo da nutrição animal — dietas, consumo e desempenho</p>
      </div>

      <Tabs defaultValue="dietas" className="w-full">
        <TabsList className="rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="dietas" className="rounded-lg gap-1.5 text-xs">
            <Apple className="w-3.5 h-3.5" /> Dietas
          </TabsTrigger>
          <TabsTrigger value="consumo" className="rounded-lg gap-1.5 text-xs">
            <Utensils className="w-3.5 h-3.5" /> Consumo
          </TabsTrigger>
          <TabsTrigger value="desempenho" className="rounded-lg gap-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> Desempenho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dietas" className="mt-4"><DietasTab /></TabsContent>
        <TabsContent value="consumo" className="mt-4"><ConsumoTab /></TabsContent>
        <TabsContent value="desempenho" className="mt-4"><DesempenhoTab /></TabsContent>
      </Tabs>
    </div>
  );
}
