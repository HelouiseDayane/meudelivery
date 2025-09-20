import React, { useEffect, useState } from 'react';
import { api } from './api';

export const StockDebugger = () => {
  const [stockData, setStockData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🧪 StockDebugger: Testando API...');
        setLoading(true);
        setError(null);
        
        const data = await api.getAllProductsStock();
        console.log('✅ StockDebugger: Dados recebidos:', data);
        
        setStockData(data);
        
        if (data && data.products_stock) {
          console.log('📊 StockDebugger: Produtos com estoque:');
          data.products_stock.forEach((product: any) => {
            if (product.available_stock > 0) {
              console.log(`  - ID ${product.product_id}: ${product.product_name} = ${product.available_stock} disponível`);
            }
          });
        }
        
      } catch (err: any) {
        console.error('❌ StockDebugger: Erro:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-100 p-4 rounded border">
        <h3>🔄 Testando API de Estoque...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded border">
        <h3>❌ Erro na API de Estoque</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-green-100 p-4 rounded border">
      <h3>✅ API de Estoque Funcionando!</h3>
      {stockData && stockData.products_stock && (
        <div>
          <p>Total de produtos: {stockData.total_products}</p>
          <p>Produtos disponíveis: {stockData.products_available}</p>
          <p>Produtos esgotados: {stockData.products_out_of_stock}</p>
          
          <details className="mt-2">
            <summary>Ver dados completos</summary>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(stockData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};