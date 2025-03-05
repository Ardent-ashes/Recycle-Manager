// //import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
// import { createClient } from "@/utils/supabase/client";
// import { InfoIcon } from "lucide-react";
// import { redirect } from "next/navigation";

// export default async function ProtectedPage() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     return redirect("/sign-in");
//   }

//   return (
//     <div >
//       {/* <div className="w-full">
//         <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
//           <InfoIcon size="16" strokeWidth={2} />
//           This is a protected page that you can only see as an authenticated
//           user
//         </div>
//       </div> */}
//       {/* <div className="flex flex-col gap-2 items-start">
//         <h2 className="font-bold text-2xl mb-4">Your user details</h2>
//         <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
//           {JSON.stringify(user, null, 2)}
//         </pre>
//       </div> */}
//       <div>
//         {/* <h2 className="font-bold text-2xl mb-4">Next steps</h2>
//         <FetchDataSteps /> */}
//       </div>
//     </div>
//   );
// }


'use client'

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        //setUser(user);
      } catch (error) {
        console.error('Auth error:', error);
        router.replace('/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.replace('/sign-in');
        } else {
         // setUser(session.user);
          setIsLoading(false);
        }
      }
    );

    checkUser();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Your protected content */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
        {/* Add your components here */}
      </div>
    </div>
  );
}

// ekhane kaj korbo 