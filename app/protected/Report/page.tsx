// app/protected/Report/page.tsx
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialReport from './financialReport';
import AjairaReport from './ajaira';
import PreferredReport from './preferred';

export default function ReportPage() {
    return (
        <div className="space-y-6">
            <div className="bg-white shadow">
        <div className="max-w-7xl  px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Report Summary</h1>
          </div>
        </div>
      </div>
            <Tabs defaultValue="financial" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="financial">Financial Reports</TabsTrigger>
                    {/* <TabsTrigger value="ajaira">Ajaira Reports</TabsTrigger> */}
                    <TabsTrigger value="preferred">Plant Processing Comparison</TabsTrigger>
                </TabsList>
                
                <TabsContent value="financial">
                    <FinancialReport />
                </TabsContent>
                
                <TabsContent value="ajaira">
                    <AjairaReport />
                </TabsContent>
                
                <TabsContent value="preferred">
                    <PreferredReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}