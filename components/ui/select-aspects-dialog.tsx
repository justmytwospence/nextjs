"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Aspect } from "@/pathfinder/index.d.ts";
import { useState } from "react";

const aspects = new Set<Aspect>([
  "North" as Aspect,
  "Northeast" as Aspect,
  "East" as Aspect,
  "Southeast" as Aspect,
  "South" as Aspect,
  "Southwest" as Aspect,
  "West" as Aspect,
  "Northwest" as Aspect,
]);

interface SelectAspectsDialogProps {
  onSelectDirections: (directions: Aspect[]) => void;
  selectedDirections: Aspect[];
}

export function SelectAspectsDialog({
  onSelectDirections,
  selectedDirections,
}: SelectAspectsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<Aspect>>(
    new Set(selectedDirections)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          {selectedDirections.length
            ? `Avoiding ${selectedDirections.join(", ")}`
            : "Choose aspects to avoid"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select aspects to avoid</DialogTitle>
          <DialogDescription>
            Selected aspects will be excluded from the path if they exceed 5% gradient.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {Array.from(aspects).map((direction) => (
            <Card
              key={direction}
              className={`p-2 text-center cursor-pointer hover:bg-accent ${
                selected.has(direction)
                  ? "bg-primary text-primary-foreground"
                  : ""
              }`}
              onClick={() => {
                const newSelected = new Set(selected);
                if (selected.has(direction)) {
                  newSelected.delete(direction);
                } else {
                  newSelected.add(direction);
                }
                setSelected(newSelected);
              }}
            >
              {direction}
            </Card>
          ))}
        </div>
        <Button
          onClick={() => {
            onSelectDirections(Array.from(selected));
            setOpen(false);
          }}
        >
          Apply
        </Button>
      </DialogContent>
    </Dialog>
  );
}
