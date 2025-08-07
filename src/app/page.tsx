import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Cog, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      title: 'Hourly Retriever',
      description: 'Upload and process CSV files to retrieve hourly rates data with advanced filtering and reporting.',
      icon: FileText,
      href: '/hourly-retriever',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'RSP Works',
      description: 'Manage and process RSP related work items and data processing tasks.',
      icon: Cog,
      href: '/rsp-works',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'IRSP Works',
      description: 'Handle IRSP work processes and data management with comprehensive tools.',
      icon: Users,
      href: '/irsp-works',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Work Processor
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive platform for processing work data, managing hourly rates, 
            and handling various work-related tasks with efficiency and accuracy.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href}>
                    <Button className="w-full" variant="outline">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Platform Capabilities
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">CSV</div>
              <div className="text-gray-600">File Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">PDF/Excel</div>
              <div className="text-gray-600">Report Generation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Real-time</div>
              <div className="text-gray-600">Data Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">Secure</div>
              <div className="text-gray-600">Data Management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}