import { ArrowLeft } from 'lucide-react'

import { IconButton } from '../../components/ui'

type CreateLevelHeaderProps = {
  backTo: string
  backLabel: string
}

export function CreateLevelHeader({ backTo, backLabel }: CreateLevelHeaderProps) {
  return <IconButton to={backTo} label={backLabel} icon={<ArrowLeft size={16} />} />
}
