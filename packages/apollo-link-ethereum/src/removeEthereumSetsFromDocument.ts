import { DocumentNode, DirectiveNode } from 'graphql';
import { checkDocument, removeDirectivesFromDocument } from 'apollo-utilities';

// Code taken and modified from https://github.com/apollographql/apollo-link-state/blob/master/packages/apollo-link-state/src/utils.ts

const connectionRemoveConfig = {
  test: (directive: DirectiveNode) => ['contract', 'block'].indexOf(directive.name.value) !== -1,
  remove: true,
};

const removed = new Map();
export function removeEthereumSetsFromDocument(
  query: DocumentNode,
): DocumentNode {
  // caching
  const cached = removed.get(query);
  if (cached) return cached;

  checkDocument(query);

  const docClone = removeDirectivesFromDocument(
    [connectionRemoveConfig],
    query,
  );

  // caching
  removed.set(query, docClone);
  return docClone;
}
