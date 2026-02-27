import { Suspense } from "react";
import Home from "./Home";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <Home />
    </Suspense>
  );
}