import { IconArrowDown, IconArrowUp, IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card border-border/50 bg-card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <IconArrowDown className="size-4 text-primary" />
            </span>
            Total Spent
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $4,892.50
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-destructive border-destructive/30">
              <IconTrendingUp className="size-3" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            vs $4,520 last month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border-border/50 bg-card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10">
              <IconArrowUp className="size-4 text-chart-2" />
            </span>
            Income
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $7,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-primary border-primary/30">
              <IconTrendingUp className="size-3" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            vs $6,440 last month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border-border/50 bg-card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10">
              <IconTrendingUp className="size-4 text-chart-3" />
            </span>
            Savings
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $2,357.50
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-primary border-primary/30">
              <IconTrendingUp className="size-3" />
              +22.8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            32% of income saved
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border-border/50 bg-card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-chart-4/10">
              <IconTrendingDown className="size-4 text-chart-4" />
            </span>
            Budget Left
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,107.50
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-chart-3 border-chart-3/30">
              On Track
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            18% of monthly budget
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
