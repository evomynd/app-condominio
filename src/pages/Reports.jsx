import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import EChartsReact from 'echarts-for-react';
import { FileText, Download, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Reports = () => {
  const [packages, setPackages] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [selectedMonth]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const packagesRef = collection(db, 'packages');
      const snapshot = await getDocs(packagesRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPackages(data);
      filterByMonth(data);
    } catch (error) {
      console.error('Erro ao carregar relatÃ³rios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByMonth = (data) => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const filtered = data.filter(pkg => {
      const pkgDate = pkg.created_at?.toDate?.();
      if (!pkgDate) return false;
      return pkgDate >= start && pkgDate <= end;
    });

    setFilteredData(filtered);
  };

  // EstatÃ­sticas do mÃªs
  const monthStats = {
    total: filteredData.length,
    retired: filteredData.filter(p => p.status === 'retired').length,
    pending: filteredData.filter(p => p.status === 'pending_pickup').length,
    perecivel: filteredData.filter(p => p.type === 'perecivel').length
  };

  // GrÃ¡fico: Taxa de Retirada
  const retirementRateData = [
    {
      name: 'Retiradas',
      value: monthStats.retired,
      percentage: monthStats.total > 0 ? Math.round((monthStats.retired / monthStats.total) * 100) : 0
    },
    {
      name: 'Pendentes',
      value: monthStats.pending,
      percentage: monthStats.total > 0 ? Math.round((monthStats.pending / monthStats.total) * 100) : 0
    }
  ];

  const retirementChartOption = {
    title: {
      text: 'Taxa de Retirada do MÃªs',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        if (params.length > 0) {
          const data = params[0];
          return `${data.name}: ${data.value}`;
        }
        return '';
      }
    },
    xAxis: {
      type: 'category',
      data: retirementRateData.map(d => d.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: retirementRateData.map(d => d.value),
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  };

  // GrÃ¡fico: DistribuiÃ§Ã£o por Hora do Dia
  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
    const count = filteredData.filter(pkg => {
      const pkgDate = pkg.created_at?.toDate?.();
      if (!pkgDate) return false;
      return pkgDate.getHours() === i;
    }).length;
    return count;
  });

  const hourlyChartOption = {
    title: {
      text: 'Encomendas por Hora do Dia',
      left: 'center'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}h`)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: hourlyDistribution,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#ec4899'
        },
        areaStyle: {
          color: 'rgba(236, 72, 153, 0.2)'
        }
      }
    ],
    tooltip: {
      trigger: 'axis'
    }
  };

  // Resumo em tabela
  const unitSummary = filteredData.reduce((acc, pkg) => {
    if (!acc[pkg.unit_id]) {
      acc[pkg.unit_id] = {
        unit_id: pkg.unit_id,
        total: 0,
        retired: 0,
        pending: 0,
        perecivel: 0
      };
    }
    acc[pkg.unit_id].total++;
    if (pkg.status === 'retired') acc[pkg.unit_id].retired++;
    if (pkg.status === 'pending_pickup') acc[pkg.unit_id].pending++;
    if (pkg.type === 'perecivel') acc[pkg.unit_id].perecivel++;
    return acc;
  }, {});

  const handleExportCSV = () => {
    let csv = 'Apartamento,Total,Retiradas,Pendentes,PerecÃ­veis\n';
    Object.values(unitSummary).forEach(unit => {
      csv += `${unit.unit_id},${unit.total},${unit.retired},${unit.pending},${unit.perecivel}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${format(selectedMonth, 'yyyy-MM')}.csv`;
    a.click();
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">RelatÃ³rios</h2>
        <button onClick={handleExportCSV} className="btn-primary">
          <Download size={16} className="inline mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Seletor de MÃªs */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar size={16} className="inline mr-2" />
          Selecione o MÃªs
        </label>
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="input-field"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* KPIs do MÃªs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-2 border-blue-200 bg-blue-50">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{monthStats.total}</p>
            </div>
            <div className="card border-2 border-green-200 bg-green-50">
              <p className="text-sm text-gray-600">Retiradas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {monthStats.retired}
                <span className="text-sm ml-2">
                  ({monthStats.total > 0 ? Math.round((monthStats.retired / monthStats.total) * 100) : 0}%)
                </span>
              </p>
            </div>
            <div className="card border-2 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {monthStats.pending}
                <span className="text-sm ml-2">
                  ({monthStats.total > 0 ? Math.round((monthStats.pending / monthStats.total) * 100) : 0}%)
                </span>
              </p>
            </div>
            <div className="card border-2 border-red-200 bg-red-50">
              <p className="text-sm text-gray-600">PerecÃ­veis</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{monthStats.perecivel}</p>
            </div>
          </div>

          {/* GrÃ¡ficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <EChartsReact option={retirementChartOption} style={{ height: '400px' }} />
            </div>
            <div className="card">
              <EChartsReact option={hourlyChartOption} style={{ height: '400px' }} />
            </div>
          </div>

          {/* Tabela de Resumo */}
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              <FileText size={20} className="inline mr-2" />
              Resumo por Apartamento
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Apartamento</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">Retiradas</th>
                    <th className="px-4 py-2 text-center">Pendentes</th>
                    <th className="px-4 py-2 text-center">PerecÃ­veis</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(unitSummary)
                    .sort((a, b) => a.unit_id - b.unit_id)
                    .map(unit => (
                      <tr key={unit.unit_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{unit.unit_id}</td>
                        <td className="px-4 py-2 text-center">{unit.total}</td>
                        <td className="px-4 py-2 text-center text-green-600 font-medium">{unit.retired}</td>
                        <td className="px-4 py-2 text-center text-yellow-600 font-medium">{unit.pending}</td>
                        <td className="px-4 py-2 text-center text-red-600 font-medium">{unit.perecivel}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;






