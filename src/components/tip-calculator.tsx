"use client";

import { useState, useEffect, useMemo } from "react";
import { DollarSign, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const tipOptions = [10, 15, 18, 20, 25];

export function TipCalculator() {
  const [bill, setBill] = useState<string>("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [customTipPercent, setCustomTipPercent] = useState<string>("");
  const [numPeople, setNumPeople] = useState<number>(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const billAmount = parseFloat(bill);
  
  const activeTip = customTipPercent === "" ? tipPercent : parseFloat(customTipPercent) || 0;

  const { tipPerPerson, totalPerPerson } = useMemo(() => {
    if (!billAmount || billAmount <= 0 || numPeople <= 0) {
      return { tipPerPerson: 0, totalPerPerson: 0 };
    }
    const totalTip = billAmount * (activeTip / 100);
    const totalBill = billAmount + totalTip;
    const tipPerPerson = totalTip / numPeople;
    const totalPerPerson = totalBill / numPeople;
    return { tipPerPerson, totalPerPerson };
  }, [billAmount, activeTip, numPeople]);

  const handleReset = () => {
    setBill("");
    setTipPercent(15);
    setCustomTipPercent("");
    setNumPeople(1);
  };

  const handlePeopleChange = (newVal: number) => {
    if (newVal >= 1) {
        setNumPeople(newVal);
    }
  }
  
  const handleTipSelection = (tip: number) => {
    setTipPercent(tip);
    setCustomTipPercent("");
  }

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomTipPercent(value);
  }
  
  const formatCurrency = (value: number) => {
    if (!isMounted) return '$0.00';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };
  
  return (
    <Card className="w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden bg-card">
        <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
                <div className="p-8 space-y-8">
                    <div>
                        <Label htmlFor="bill" className="font-bold text-muted-foreground">Bill Amount</Label>
                        <div className="relative mt-2">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="bill"
                            type="number"
                            placeholder="0.00"
                            value={bill}
                            onChange={(e) => setBill(e.target.value)}
                            className="pl-12 text-2xl font-bold text-right h-12 bg-secondary border-transparent focus:border-primary focus:ring-primary"
                            min="0"
                        />
                        </div>
                    </div>

                    <div>
                        <Label className="font-bold text-muted-foreground">Select Tip %</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                        {tipOptions.map((tip) => (
                            <Button
                            key={tip}
                            variant={tipPercent === tip && customTipPercent === "" ? "default" : "secondary"}
                            onClick={() => handleTipSelection(tip)}
                            className="h-12 text-xl font-bold"
                            >
                            {tip}%
                            </Button>
                        ))}
                        <Input
                            id="custom-tip"
                            type="number"
                            placeholder="Custom"
                            value={customTipPercent}
                            onChange={handleCustomTipChange}
                            className={cn(
                                "h-12 text-xl font-bold text-center placeholder:text-muted-foreground bg-secondary border-transparent focus:border-primary focus:ring-primary",
                                customTipPercent !== "" ? "ring-2 ring-primary" : ""
                            )}
                            min="0"
                        />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="people" className="font-bold text-muted-foreground">Number of People</Label>
                        <div className="relative mt-2">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="people"
                            type="number"
                            value={numPeople}
                            onChange={(e) => handlePeopleChange(parseInt(e.target.value, 10) || 1)}
                            className="pl-12 text-2xl font-bold text-right h-12 bg-secondary border-transparent focus:border-primary focus:ring-primary"
                            min="1"
                        />
                        </div>
                    </div>
                </div>

                <div className="bg-primary rounded-xl m-4 p-8 text-primary-foreground flex flex-col justify-between shadow-inner">
                    <div className="space-y-10">
                        <div key={`tip-${tipPerPerson}`} className="flex items-center justify-between animate-in fade-in duration-500">
                            <div>
                                <p className="text-lg text-primary-foreground">Tip Amount</p>
                                <p className="text-sm text-primary-foreground/80">/ person</p>
                            </div>
                            <p className="text-4xl lg:text-5xl font-bold text-accent">{formatCurrency(tipPerPerson)}</p>
                        </div>
                        <div key={`total-${totalPerPerson}`} className="flex items-center justify-between animate-in fade-in duration-700">
                            <div>
                                <p className="text-lg text-primary-foreground">Total</p>

                                <p className="text-sm text-primary-foreground/80">/ person</p>
                            </div>
                            <p className="text-4xl lg:text-5xl font-bold text-accent">{formatCurrency(totalPerPerson)}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleReset} 
                        className="w-full mt-8 h-12 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground uppercase tracking-widest"
                        disabled={!bill && numPeople === 1 && tipPercent === 15 && customTipPercent === ""}
                    >
                        Reset
                    </Button>
                </div>
            </div>
      </CardContent>
    </Card>
  );
}
