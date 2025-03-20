import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";

export default function Home() {
  return (
    <>
      <div className="text-center py-12 bg-gradient-to-r from-green-700 via-teal-700 to-blue-900 shadow-lg">
        <h1 className="text-5xl font-bold text-white mb-3 tracking-wide">
          Industrial Waste Management System
        </h1>
        <p className="text-gray-200 text-xl">
          Efficient • Sustainable • Compliant
        </p>
      </div>

      <main className="flex-1 flex flex-col gap-6 p-8">
        {/* Your main content will go here */}
      </main>
    </>
  );
}