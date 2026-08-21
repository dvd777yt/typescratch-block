export type BlockID = string & { __brand: "BlockID" };

export function generateRandomBlockId(): BlockID {
   const arr = new Uint32Array(3);
   crypto.getRandomValues(arr);
   return (BigInt(arr[0]) << 64n | BigInt(arr[1]) << 32n | BigInt(arr[2])).toString(36) as BlockID;
}
