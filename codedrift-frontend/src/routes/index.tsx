/*
* Author: Jamius Siam
* Since: 30/05/2026
*/
import {createFileRoute} from '@tanstack/react-router'
import type {JSX} from "react";

const Index = (): JSX.Element => {
  return (
    <div>
      <h3>Welcome to Codedrift!</h3>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})