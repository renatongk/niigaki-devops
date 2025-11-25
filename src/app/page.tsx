import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CEASA SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Começar Grátis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Controle de Compras do{' '}
            <span className="text-green-600">CEASA</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema multi-tenant completo para gerenciar compras, estoque, distribuição,
            finanças e embalagens retornáveis da sua rede de lojas.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              Começar Gratuitamente
            </Link>
            <Link
              href="#features"
              className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              Conheça os Recursos
            </Link>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tudo que você precisa para gerenciar suas compras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Multi-lojas',
                description: 'Gerencie múltiplas lojas com usuários específicos para cada uma.',
                icon: '🏪',
              },
              {
                title: 'Pedidos por Loja',
                description: 'Cada loja cria seus pedidos com os itens que precisa.',
                icon: '📋',
              },
              {
                title: 'Estoque Diário',
                description: 'Visualize o estoque disponível no CEASA em tempo real.',
                icon: '📦',
              },
              {
                title: 'Compras Centralizadas',
                description: 'O comprador realiza as compras e distribui entre as lojas.',
                icon: '🛒',
              },
              {
                title: 'Controle Financeiro',
                description: 'Acompanhe receitas, despesas e pagamentos de fornecedores.',
                icon: '💰',
              },
              {
                title: 'Devoluções',
                description: 'Gerencie devoluções de mercadorias para fornecedores.',
                icon: '↩️',
              },
              {
                title: 'Embalagens Retornáveis',
                description: 'Controle o saldo de caixas e embalagens retornáveis.',
                icon: '📥',
              },
              {
                title: 'Assinaturas Flexíveis',
                description: 'Planos que crescem com o seu negócio.',
                icon: '💳',
              },
              {
                title: 'Segurança',
                description: 'Dados isolados por tenant com Row Level Security.',
                icon: '🔒',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span className="text-4xl">{feature.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Planos e Preços
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Básico',
                price: 'R$ 99,90',
                period: '/mês',
                features: ['Até 3 lojas', 'Até 5 usuários', 'Controle de pedidos', 'Estoque básico', 'Relatórios simples'],
                highlighted: false,
              },
              {
                name: 'Profissional',
                price: 'R$ 199,90',
                period: '/mês',
                features: ['Até 10 lojas', 'Até 20 usuários', 'Todos do Básico', 'Financeiro completo', 'Devoluções', 'Embalagens retornáveis'],
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'R$ 399,90',
                period: '/mês',
                features: ['Lojas ilimitadas', 'Usuários ilimitados', 'Todos do Profissional', 'API de integração', 'Suporte prioritário', 'Customizações'],
                highlighted: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-xl ${plan.highlighted ? 'bg-green-600 text-white ring-4 ring-green-200' : 'bg-white border border-gray-200'}`}
              >
                <h3 className={`text-xl font-semibold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`ml-1 ${plan.highlighted ? 'text-green-100' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${plan.highlighted ? 'text-green-200' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlighted ? 'text-green-50' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block w-full py-3 px-4 rounded-lg font-medium text-center transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-green-600 hover:bg-green-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Começar Agora
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold">CEASA SaaS</span>
            </div>
            <p className="mt-4 md:mt-0 text-gray-400">
              © 2024 CEASA SaaS. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
