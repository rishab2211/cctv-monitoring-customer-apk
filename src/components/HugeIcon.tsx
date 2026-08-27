import React from 'react';
import { HugeiconsIcon, HugeiconsProps, IconSvgElement } from '@hugeicons/react-native';

export interface HugeIconProps extends Omit<HugeiconsProps, 'icon'> {
  icon: IconSvgElement;
}

export const HugeIcon: React.FC<HugeIconProps> = ({
  icon,
  size = 20,
  strokeWidth = 1.8,
  color = '#FFFFFF',
  ...props
}) => {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      {...props}
    />
  );
};

export { HugeiconsIcon };
export type { IconSvgElement };
