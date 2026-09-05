'use client'

// Static generic row label for array fields (e.g. "Item", "Step", "Pillar")
// instead of Payload's default numbered "Item 01" placeholder — these are
// interchangeable repeatable items, not individually distinct entries.
// Reused across all 5 arrays on the Home Page global via clientProps.
interface Props {
  label: string
}

export default function ArrayRowLabel({ label }: Props) {
  return <div>{label}</div>
}
