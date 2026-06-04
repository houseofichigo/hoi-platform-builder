import { HoiTokenizer } from "@/components/tokenizer/HoiTokenizer";

interface Props {
  compact?: boolean;
}

export function TokenizerLab({ compact = false }: Props) {
  return <HoiTokenizer compact={compact} />;
}
