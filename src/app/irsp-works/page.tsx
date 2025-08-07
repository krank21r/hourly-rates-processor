import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function IRSPWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">IRSP Works</h1>
          <p className="text-lg text-gray-600">
            Handle IRSP work processes and data management with comprehensive tools.
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">IRSP Works Module</CardTitle>
                <CardDescription>
                  This section is under development. More features will be added soon.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">Upcoming Features:</h3>
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li>IRSP Work Process Management</li>
                  <li>Data Integration Tools</li>
                  <li>Advanced Analytics</li>
                  <li>Workflow Automation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}