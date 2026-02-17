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
import { SkillCard } from "@/components/SkillCard";
import { SKILL_CATEGORIES } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { skillsApi } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Select a category"),
  ratePerHour: z.coerce.number().min(1, "Rate must be at least 1"),
  complexity: z.enum(["simple", "moderate", "complex"]),
});

type FormData = z.infer<typeof schema>;

export default function CreateSkillOffer() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "", ratePerHour: 15, complexity: "simple" },
  });

  const values = form.watch();

  const previewSkill = {
    id: "preview",
    userId: "u1",
    teacherName: "You",
    teacherType: "professional" as const,
    title: values.title || "Skill Title",
    description: values.description || "Your skill description will appear here.",
    category: values.category || "Category",
    ratePerHour: values.ratePerHour || 0,
    complexity: values.complexity || "simple",
    status: "active" as const,
    createdAt: new Date().toISOString(),
  };

  const onSubmit = async (data: FormData) => {
    try {
      await skillsApi.createSkill({
        title: data.title,
        description: data.description,
        category: data.category,
        rate_per_hour: data.ratePerHour,
        complexity: data.complexity,
      });
      toast({ title: "Skill listed!", description: `"${data.title}" is now available for learners.` });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create skill",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-2 text-3xl font-bold">Teach a Skill</h1>
        <p className="mb-8 text-muted-foreground">List a skill you want to teach and start earning credits</p>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Skill Details</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. React Fundamentals" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe what you'll teach..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{SKILL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ratePerHour" render={({ field }) => (
                      <FormItem><FormLabel>Rate (credits/hr)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="complexity" render={({ field }) => (
                      <FormItem><FormLabel>Complexity</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="simple">Simple</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="complex">Complex</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full">Publish Skill</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div>
            <p className="label-uppercase mb-3">Preview</p>
            <SkillCard skill={previewSkill} />
          </div>
        </div>
      </main>
    </div>
  );
}
