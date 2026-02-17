import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SKILL_CATEGORIES } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { skillRequestsApi } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  maxRate: z.coerce.number().min(1, "Max rate must be at least 1"),
  urgency: z.enum(["low", "medium", "high"]),
  maxBudget: z.coerce.number().min(1, "Budget must be at least 1"),
});

type FormData = z.infer<typeof schema>;

export default function CreateSkillRequest() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "", maxRate: 20, urgency: "medium", maxBudget: 50 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await skillRequestsApi.createSkillRequest({
        title: data.title,
        description: data.description,
        category: data.category,
        preferred_rate_max: data.maxRate,
        urgency: data.urgency,
        budget: data.maxBudget,
      });
      toast({ title: "Request posted!", description: `Your request for "${data.title}" is now visible to teachers.` });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create skill request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-2 text-3xl font-bold">Learn a Skill</h1>
        <p className="mb-8 text-muted-foreground">Post a request and find the right teacher</p>

        <Card className="mx-auto max-w-xl">
          <CardHeader><CardTitle>Skill Request</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>What do you want to learn?</FormLabel><FormControl><Input placeholder="e.g. Guitar basics" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Details</FormLabel><FormControl><Textarea placeholder="Describe what you'd like to learn, your level, goals..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{SKILL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="maxRate" render={({ field }) => (
                    <FormItem><FormLabel>Max rate (credits/hr)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="maxBudget" render={({ field }) => (
                    <FormItem><FormLabel>Max budget (credits)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="urgency" render={({ field }) => (
                  <FormItem><FormLabel>Urgency</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Low — No rush</SelectItem><SelectItem value="medium">Medium — Within a week</SelectItem><SelectItem value="high">High — ASAP</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full">Post Request</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
