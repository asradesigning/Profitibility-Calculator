import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Register form schema
const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  passwordConfirm: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm isLoading={loginMutation.isPending} onSubmit={data => loginMutation.mutate(data)} />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm isLoading={registerMutation.isPending} onSubmit={data => registerMutation.mutate(data)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero section */}
      <div className="hidden lg:block relative w-0 flex-1 bg-orange-600">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 flex flex-col justify-center px-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Profitability Analysis Tool
            </h1>
            <p className="mt-6 text-xl text-white">
              Transform your business data into intuitive, visually engaging financial insights.
              Make data-driven decisions to increase your profitability.
            </p>
            <div className="mt-12">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-white">Financial Projections</h3>
                  <p className="text-white/80 text-sm mt-1">Calculate ROI, break-even point and profit margins</p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-white">Scenario Analysis</h3>
                  <p className="text-white/80 text-sm mt-1">Compare optimistic, realistic and pessimistic outcomes</p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-white">Interactive Dashboard</h3>
                  <p className="text-white/80 text-sm mt-1">Visualize data with custom charts and graphs</p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-white">Smart Recommendations</h3>
                  <p className="text-white/80 text-sm mt-1">Get AI-powered insights to improve profitability</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ 
  isLoading, 
  onSubmit 
}: { 
  isLoading: boolean; 
  onSubmit: (values: LoginFormValues) => void;
}) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RegisterForm({ 
  isLoading, 
  onSubmit 
}: { 
  isLoading: boolean; 
  onSubmit: (values: RegisterFormValues) => void;
}) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Sign up to get started with the app</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Choose a username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}