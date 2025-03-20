'use client'

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
    Truck, 
    Recycle, 
    Factory, 
    BarChart3,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface Statistics {
    pendingGarbage: number;
    pendingVehicles: number;
    activeProcesses: number;
}

export default function HomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Statistics>({
        pendingGarbage: 0,
        pendingVehicles: 0,
        activeProcesses: 0
    });
    const supabase = createClient();

    const fetchStatistics = async () => {
      try {
          // Fetch pending garbage requests (where garbage_req_status is true and remaining_garbage > 0)
          const { data: garbageData, error: garbageError } = await supabase
              .from('factory_garbage_request')
              .select('garbage_req_id')
              .eq('garbage_req_status', true)
              .gt('remaining_garbage', 0);
  
          if (garbageError) throw garbageError;
  
          // Fetch pending vehicle requests (where vehicle_req_status is true)
          const { data: vehicleData, error: vehicleError } = await supabase
              .from('vehicle_request')
              .select('vehicle_req_id')
              .eq('vehicle_req_status', true);
  
          if (vehicleError) throw vehicleError;
  
          // Fetch active recycling processes (where plant_process_status is true)
          const { data: processData, error: processError } = await supabase
              .from('recycle_process')
              .select('recycle_process_id')
              .eq('plant_process_status', true);
  
          if (processError) throw processError;
  
          // Update stats with the actual counts
          setStats({
              pendingGarbage: garbageData?.length || 0,
              pendingVehicles: vehicleData?.length || 0,
              activeProcesses: processData?.length || 0
          });
  
          console.log('Statistics:', {
              pendingGarbage: garbageData?.length || 0,
              pendingVehicles: vehicleData?.length || 0,
              activeProcesses: processData?.length || 0
          });
  
      } catch (error) {
          console.error('Error fetching statistics:', error);
      }
    };

    useEffect(() => {
        const initializePage = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error || !session) {
                    router.replace('/sign-in');
                    return;
                }

                await fetchStatistics();
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializePage();

        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.replace('/sign-in');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Updated to use full width
    return (
        <div className="w-full p-4 space-y-8">
            {/* Hero Section - Full width with reasonable text constraints */}
            <div className="text-center py-12 bg-gradient-to-r from-green-50 to-blue-50">
                <h1 className="text-4xl font-bold mb-4">
                ReSync : An Industrial Recycling & Waste Management System

                </h1>
                <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                    Efficiently manage industrial waste collection, transportation, and recycling processes
                    with our comprehensive management system.
                </p>
            </div>

            {/* Statistics Cards - Adjusted for better full-width layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Garbage Requests
                        </CardTitle>
                        <Factory className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.pendingGarbage}</div>
                            <div className="text-green-500 flex items-center">
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active requests from factories
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Vehicle Assignments
                        </CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.pendingVehicles}</div>
                            <div className="text-yellow-500 flex items-center">
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Vehicles currently on route
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Recycling Processes
                        </CardTitle>
                        <Recycle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.activeProcesses}</div>
                            <div className="text-blue-500 flex items-center">
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ongoing recycling operations
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Features Section - Expanded to utilize more screen space */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Waste Collection</CardTitle>
                        <CardDescription>
                            Streamlined process for managing factory waste collection requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-2">
                            <li>Automated request processing</li>
                            <li>Real-time status tracking</li>
                            <li>Efficient route planning</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transportation</CardTitle>
                        <CardDescription>
                            Optimized vehicle management and routing system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-2">
                            <li>Smart vehicle assignment</li>
                            <li>Route optimization</li>
                            <li>Cost-effective operations</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recycling Process</CardTitle>
                        <CardDescription>
                            Complete recycling plant management solution
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-2">
                            <li>Process tracking</li>
                            <li>Quality control</li>
                            <li>Performance analytics</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}