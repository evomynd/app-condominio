import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import EChartsReact from 'echarts-for-react';
import { BarChart3, PieChart, TrendingUp, Package } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    retired: 0,
    perecivel: 0
  });
  const [chartDataReady, setChartDataReady] = useState(false);
  const [packagesData, setPackagesData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const packagesRef = collection(db, 'packages');
      const snapshot = await getDocs(packagesRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPackagesData(data);

      // Calcular estatÃ­sticas
      const total = data.length;
      const pending = data.filter(p => p.status === 'pending_pickup').length;
      const retired = data.filter(p => p.status === 'retired').length;
      const perecivel = data.filter(p => p.type === 'perecivel').length;

      setStats({ total, pending, retired, perecivel });
      setChartDataReady(true);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  // GrÃ¡fico 1: Status das Encomendas (Pizza)
  const statusChartOption = {
    title: {
      text: 'Status das Encomendas',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Encomendas',
        type: 'pie',
        radius: '50%',
        data: [
          { value: stats.pending, name: 'Pendentes' },
          { value: stats.retired, name: 'Retiradas' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // GrÃ¡fico 2: Tipo de Encomendas
  const typeChartOption = {
    title: {
      text: 'Tipo de Encomendas',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Tipo',
        type: 'pie',
        radius: '50%',
        data: [
          { value: stats.perecivel, name: 'PerecÃ­vel' },
          { value: stats.total - stats.perecivel, name: 'Setor Encomendas' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // GrÃ¡fico 3: DistribuiÃ§Ã£o por LocalizaÃ§Ã£o
  const locationData = packagesData.reduce((acc, pkg) => {
    const location = pkg.location === 'setor' ? 'Setor' : 'Portaria';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  const locationChartOption = {
    title: {
      text: 'Encomendas por LocalizaÃ§Ã£o',
      left: 'center'
    },
    xAxis: {
      type: 'category',
      data: Object.keys(locationData)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: Object.values(locationData),
        type: 'bar',
        itemStyle: {
          color: '#3b82f6'
        }
      }
    ],
    tooltip: {
      trigger: 'axis'
    }
  };

  // GrÃ¡fico 4: Top 10 Apartamentos
  const unitData = packagesData.reduce((acc, pkg) => {
    acc[pkg.unit_id] = (acc[pkg.unit_id] || 0) + 1;
    return acc;
  }, {});

  const topUnits = Object.entries(unitData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const unitsChartOption = {
    title: {
      text: 'Top 10 Apartamentos com Encomendas',
      left: 'center'
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: topUnits.map(u => `Apto ${u[0]}`)
    },
    series: [
      {
        data: topUnits.map(u => u[1]),
        type: 'bar',
        itemStyle: {
          color: '#10b981'
        }
      }
    ],
    tooltip: {
      trigger: 'axis'
    }
  };

  // GrÃ¡fico 5: Encomendas por Data (Ãšltimos 7 dias)
  const last7Days = getLast7Days();
  const dailyData = last7Days.map(date => {
    const count = packagesData.filter(pkg => {
      const pkgDate = pkg.created_at?.toDate?.();
      if (!pkgDate) return false;
      return pkgDate.toDateString() === new Date(date).toDateString();
    }).length;
    return count;
  });

  const timelineChartOption = {
    title: {
      text: 'Encomendas dos Ãšltimos 7 Dias',
      left: 'center'
    },
    xAxis: {
      type: 'category',
      data: last7Days.map(d => new Date(d).toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }))
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: dailyData,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#f59e0b'
        },
        lineStyle: {
          color: '#f59e0b'
        }
      }
    ],
    tooltip: {
      trigger: 'axis'
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard de Encomendas</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total', value: stats.total, icon: Package, color: 'blue' },
          { title: 'Pendentes', value: stats.pending, icon: TrendingUp, color: 'yellow' },
          { title: 'Retiradas', value: stats.retired, icon: BarChart3, color: 'green' },
          { title: 'PerecÃ­veis', value: stats.perecivel, icon: PieChart, color: 'red' }
        ].map((item, idx) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 text-blue-600',
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
            green: 'bg-green-50 border-green-200 text-green-600',
            red: 'bg-red-50 border-red-200 text-red-600'
          };

          return (
            <div key={idx} className={`card border-2 ${colorClasses[item.color]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{item.title}</p>
                  <p className="text-3xl font-bold mt-1">{item.value}</p>
                </div>
                <Icon size={40} className="opacity-20" />
              </div>
            </div>
          );
        })}
      </div>

      {/* GrÃ¡ficos */}
      {chartDataReady && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status */}
          <div className="card">
            <EChartsReact option={statusChartOption} style={{ height: '400px' }} />
          </div>

          {/* Tipo */}
          <div className="card">
            <EChartsReact option={typeChartOption} style={{ height: '400px' }} />
          </div>

          {/* LocalizaÃ§Ã£o */}
          <div className="card">
            <EChartsReact option={locationChartOption} style={{ height: '400px' }} />
          </div>

          {/* Top Unidades */}
          <div className="card">
            <EChartsReact option={unitsChartOption} style={{ height: '400px' }} />
          </div>

          {/* Timeline - Full width */}
          <div className="card lg:col-span-2">
            <EChartsReact option={timelineChartOption} style={{ height: '400px' }} />
          </div>
        </div>
      )}

      {!chartDataReady && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

export default Dashboard;


