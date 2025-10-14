'use client';
import React from 'react';
import { ChartViewerComponent } from './chart';

// Componente Info originale
interface InfoProps {
  info: string;
}

const InfoComponent: React.FC<InfoProps> = ({ info }) => {
  return <div className="text-blue-500">{info}</div>;
};

// Named exports per LoadExternalComponent
export const info = InfoComponent;
export const chartviewer = ChartViewerComponent;

// Default export con tutti i componenti
export default {
  info: InfoComponent,
  chartviewer: ChartViewerComponent,
};
