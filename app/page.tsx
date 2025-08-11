import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, DollarSign, Smartphone } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">WhatsMoney</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost">Entrar</Button>
              <Button>Cadastrar</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Monetize seu Status do
            <span className="text-green-600"> WhatsApp</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Conectamos usuários que vendem espaço em seus status do WhatsApp com empresas que querem anunciar. Ganhe
            dinheiro com seus stories!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Começar a Ganhar
            </Button>
            <Button size="lg" variant="outline">
              Sou Empresa
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Como Funciona</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Cadastre-se</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Crie seu perfil, defina seu preço e mostre suas estatísticas do WhatsApp
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Search className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Seja Encontrado</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Empresas encontram você através de filtros por nicho, preço e audiência
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Receba Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Negocie, publique o anúncio e receba pagamento via PayPal ou transferência
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">Números que Impressionam</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-green-600">1000+</div>
              <div className="text-gray-600">Anfitriões Ativos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Empresas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">R$ 50k+</div>
              <div className="text-gray-600">Pagamentos Realizados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">98%</div>
              <div className="text-gray-600">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Pronto para Monetizar seu WhatsApp?</h3>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a milhares de usuários que já estão ganhando dinheiro com seus status
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Smartphone className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">WhatsMoney</span>
              </div>
              <p className="text-gray-400">A plataforma que conecta criadores de conteúdo com empresas anunciantes.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Como Funciona</li>
                <li>Preços</li>
                <li>Recursos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Contato</li>
                <li>Status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Termos de Uso</li>
                <li>Privacidade</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WhatsMoney. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
