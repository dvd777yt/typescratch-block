let idCounter = 0;

export type BlockID = string & { __brand: "BlockID" };

export function generateRandomBlockId(): BlockID {
   idCounter++;
   const id = idCounter.toString(36) + Math.random().toString(36).slice(2, 4);
   return id as BlockID;
}
