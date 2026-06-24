import type { SchemaTypeDefinition } from 'sanity';
import { mannschaft } from './mannschaft';
import { badmintonMannschaft, dartsMannschaft } from './sparteMannschaft';
import { badmintonInfo, dartsInfo } from './sparteInfo';

/** Alle Dokument-/Objekttypen des Studios. Nach und nach erweitern. */
export const schemaTypes: SchemaTypeDefinition[] = [
  mannschaft,
  badmintonMannschaft,
  dartsMannschaft,
  badmintonInfo,
  dartsInfo,
];
