import React from 'react';

interface IoniconsProps {
  name: string;
  size?: number;
  color?: string;
}

export const Ionicons = ({ name, size, color }: IoniconsProps) =>
  React.createElement('span', {
    'data-testid': 'icon',
    'data-name': name,
    'data-size': size,
    'data-color': color,
  });
