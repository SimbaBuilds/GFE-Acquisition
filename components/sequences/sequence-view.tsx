"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { EmailSequence } from "@/lib/types"
import { Mail, Link, Phone, Clock } from "lucide-react"

interface SequenceViewProps {
  sequences: EmailSequence[]
}

const CHANNEL_ICON = {
  email: Mail,
  linkedin: Link,
  phone: Phone,
}

export function SequenceView({ sequences }: SequenceViewProps) {
  return (
    <div className="space-y-6">
      {sequences.map((seq) => (
        <Card key={seq.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{seq.name}</CardTitle>
              <Badge variant={seq.is_active ? "default" : "secondary"}>
                {seq.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {seq.description && (
              <p className="text-sm text-muted-foreground">{seq.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seq.steps?.map((step, idx) => {
                const Icon = CHANNEL_ICON[step.channel] ?? Mail
                return (
                  <div key={step.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {step.step_number}
                        </div>
                        {idx < (seq.steps?.length ?? 0) - 1 && (
                          <div className="w-px flex-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm capitalize">{step.channel}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Day {step.delay_days}
                          </span>
                        </div>
                        <div className="text-sm font-medium">{step.subject_template}</div>
                        <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4">
                          {step.body_template}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
