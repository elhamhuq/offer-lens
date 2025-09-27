import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cashflow Compass
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Make informed career decisions with comprehensive financial projections
          </p>
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 mb-8">
              Upload job offers, configure your investment preferences, and get AI-powered 
              insights to guide your financial future.
            </p>
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  We're building an amazing tool to help you evaluate job offers 
                  with integrated investment planning and financial simulations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-4">
                  <Button variant="default">Get Started</Button>
                  <Button variant="outline">Learn More</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
