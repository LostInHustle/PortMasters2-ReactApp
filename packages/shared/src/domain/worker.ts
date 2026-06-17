import type { ProductId } from '../data/products.js';

// Ported verbatim from PortMasters2/server.py hire_worker (line 885): each worker is a plain
// record, not a class. progress is always reset to 0 by assign_task/process_production in the
// original and never read elsewhere, but is kept here for to_dict()/PlayerGameState fidelity.
// task is a ProductId, never a raw resource: assign_task/process_production both key RECIPES
// (a Record<ProductId, Recipe>) with it directly.
export interface Worker {
  task: ProductId | null;
  progress: number;
  producedCount: number;
  isSkilled: boolean;
}
