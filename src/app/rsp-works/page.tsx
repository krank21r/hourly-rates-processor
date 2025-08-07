import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog } from 'lucide-react';

export default function RSPWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">RSP Works</h1>
          <p className="text-lg text-gray-600">
            Manage and process RSP related work items and data processing tasks.
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Cog className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">RSP Works Module</CardTitle>
                <CardDescription>
                  This section is under development. More features will be added soon.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Upcoming Features:</h3>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>RSP Work Item Management</li>
                  <li>Data Processing Tools</li>
                  <li>Reporting and Analytics</li>
                  <li>Integration Capabilities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}