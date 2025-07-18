'use client';

import { useState, useMemo } from 'react';
import { suggestTipPercentage } from '@/ai/flows/suggest-tip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Users, Sparkles, Loader2 } from 'lucide-react';

export default function TipSplitterPage() {
  const [bill, setBill] = useState<number>(100);
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [people, setPeople] = useState<number>(2);

  const [location, setLocation] = useState('');
  const [serviceQuality, setServiceQuality] = useState('good');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const { toast } = useToast();

  const handleBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBill(isNaN(value) || value < 0 ? 0 : value);
  };

  const handlePeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPeople(isNaN(value) || value < 1 ? 1 : value);
  };
  
  const { tipPerPerson, totalPerPerson } = useMemo(() => {
    if (bill <= 0 || people < 1) {
      return { tipPerPerson: 0, totalPerPerson: 0 };
    }
    const totalTip = bill * (tipPercentage / 100);
    const totalBill = bill + totalTip;
    const tipPerPerson = totalTip / people;
    const totalPerPerson = totalBill / people;
    return { tipPerPerson, totalPerPerson };
  }, [bill, tipPercentage, people]);


  const handleSuggestTip = async () => {
    if (!location) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Please enter a location to get a tip suggestion.',
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const result = await suggestTipPercentage({ location, serviceQuality });
      setTipPercentage(result.suggestedTipPercentage);
      toast({
        title: 'Success!',
        description: `We've updated the tip to ${result.suggestedTipPercentage}% based on your feedback.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not get a tip suggestion at this time. Please try again later.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 bg-background font-headline">
      <Card className="w-full max-w-md shadow-2xl transition-all duration-500">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">TipSplitter</CardTitle>
          <CardDescription>Split bills with ease and precision.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bill">Bill Amount</Label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="bill"
                  type="number"
                  placeholder="100.00"
                  value={bill > 0 ? bill : ''}
                  onChange={handleBillChange}
                  className="pl-10 text-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="people">Number of People</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="people"
                  type="number"
                  placeholder="2"
                  value={people > 0 ? people : ''}
                  onChange={handlePeopleChange}
                  min="1"
                  className="pl-10 text-lg"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Tip Percentage</Label>
                <span className="font-bold text-lg text-primary">{tipPercentage}%</span>
              </div>
              <Slider
                value={[tipPercentage]}
                onValueChange={(value) => setTipPercentage(value[0])}
                max={50}
                step={1}
              />
            </div>
          </div>
          
          <div className="bg-primary/10 p-6 rounded-lg space-y-4 text-center">
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                    <Label className="text-sm text-muted-foreground">Tip per Person</Label>
                    <p className="text-2xl font-bold text-primary transition-all duration-300">
                      {formatCurrency(tipPerPerson)}
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <Label className="text-sm text-muted-foreground">Total per Person</Label>
                    <p className="text-2xl font-bold text-primary transition-all duration-300">
                      {formatCurrency(totalPerPerson)}
                    </p>
                </div>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span>AI Tip Suggestion</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (e.g., city, state)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Quality</Label>
                  <RadioGroup defaultValue="good" onValueChange={setServiceQuality} value={serviceQuality} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poor" id="poor" />
                      <Label htmlFor="poor">Poor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fair" id="fair" />
                      <Label htmlFor="fair">Fair</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="good" />
                      <Label htmlFor="good">Good</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="excellent" />
                      <Label htmlFor="excellent">Excellent</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button onClick={handleSuggestTip} disabled={isSuggesting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isSuggesting ? 'Thinking...' : 'Suggest Tip'}
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </CardContent>
      </Card>
    </main>
  );
}
