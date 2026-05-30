/*
* Author: Jamius Siam
* Since: 30/05/2026
*/
import {createFileRoute} from '@tanstack/react-router'
import type {JSX} from "react";
import { Button } from "@/components/ui/button.tsx";

const Index = (): JSX.Element => {
  return (
    <div className="p-2">
      <h3>Welcome to Codedrift!</h3>
      <Button>Click Me</Button>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})