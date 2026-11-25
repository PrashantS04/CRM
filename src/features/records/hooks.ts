import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import {
  createLink,
  createRecord,
  deleteLink,
  getDeletedFields,
  getFields,
  getMe,
  getMetadata,
  getRecord,
  getRules,
  getSections,
  getUsers,
  OBJECTS,
  makeLinkPrimary,
  patchRecord,
  searchRecords,
  updateLink,
  type LinkInput,
  type ObjectInfo,
  type ObjectKey,
  type RecordDetail,
  type SearchRequest,
} from './api'
import { getAuditLog, getRecordHistory } from './audit'
import type { DraftRecordField, FieldDef, Values } from './fields/types'

/** Query keys for live CRM data (separate from the mock keys in api/queryKeys.ts). */
export const crmKeys = {
  metadata: ['crm', 'metadata'] as const,
  users: ['crm', 'users'] as const,
  me: ['crm', 'me'] as const,
  fields: (object: ObjectKey, includeDisabled = false) => ['crm', 'fields', object, includeDisabled] as const,
  deletedFields: (object: ObjectKey) => ['crm', 'deleted-fields', object] as const,
  rules: (object: ObjectKey) => ['crm', 'rules', object] as const,
  search: (object: ObjectKey, req: SearchRequest) => ['crm', 'search', object, req] as const,
  searchAll: (object: ObjectKey) => ['crm', 'search', object] as const,
  record: (object: ObjectKey, id: string) => ['crm', 'record', object, id] as const,
  history: (object: ObjectKey, id: string) => ['crm', 'history', object, id] as const,
  sections: (object: ObjectKey) => ['crm', 'sections', object] as const,
  audit: (params: AuditParams) => ['crm', 'audit', params] as const,
}

export type AuditParams = Parameters<typeof getAuditLog>[0]

const LONG = 5 * 60_000

/**
 * The live configuration of one record type: its field definitions and rules, plus option lists, users and the
 * signed-in user's permissions. Forms, lists and detail pages are built from this; nothing names a field in code.
 */
export function useRecordConfig(object: ObjectKey) {
  const fields = useQuery({ queryKey: crmKeys.fields(object), queryFn: () => getFields(object), staleTime: LONG })
  const rules = useQuery({ queryKey: crmKeys.rules(object), queryFn: () => getRules(object), staleTime: LONG })
  const metadata = useQuery({ queryKey: crmKeys.metadata, queryFn: getMetadata, staleTime: LONG })
  const users = useQuery({ queryKey: crmKeys.users, queryFn: getUsers, staleTime: LONG })
  const me = useQuery({ queryKey: crmKeys.me, queryFn: getMe, staleTime: LONG })

  const picklists = metadata.data?.picklists
  const optionLabel = useCallback(
    (setCode: string | null | undefined, code: string) =>
      (setCode && picklists?.[setCode]?.values.find((v) => v.code === code)?.label) || code,
    [picklists],
  )
  const userName = useCallback(
    (id: string) => users.data?.find((u) => u.id === id)?.name ?? id,
    [users.data],
  )
  const field = useCallback(
    (apiName: string): FieldDef | undefined => fields.data?.find((f) => f.apiName === apiName),
    [fields.data],
  )
  const can = useCallback((permission: string) => !!me.data?.permissions.includes(permission), [me.data])

  return useMemo(
    () => ({
      object,
      fields: fields.data ?? [],
      rules: rules.data?.rules ?? null,
      ruleWarnings: rules.data?.warnings ?? [],
      picklists: picklists ?? {},
      /** Business settings (Hot expiry, queue owners...), changed in Setup without a release (brief §2.2). */
      settings: metadata.data?.settings ?? {},
      users: users.data ?? [],
      me: me.data ?? null,
      loading: fields.isPending || rules.isPending || metadata.isPending || users.isPending || me.isPending,
      error: fields.error ?? rules.error ?? metadata.error ?? users.error ?? me.error ?? null,
      optionLabel,
      userName,
      field,
      can,
    }),
    [object, fields.data, rules.data, picklists, metadata.data?.settings, users.data, me.data, fields.isPending, rules.isPending,
      metadata.isPending, users.isPending, me.isPending, fields.error, rules.error, metadata.error, users.error,
      me.error, optionLabel, userName, field, can],
  )
}

export type RecordConfig = ReturnType<typeof useRecordConfig>

export const useRecordSearch = (object: ObjectKey, req: SearchRequest, enabled = true) =>
  useQuery({
    queryKey: crmKeys.search(object, req),
    queryFn: () => searchRecords(object, req),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useRecord = (object: ObjectKey, id: string, includeArchived = false) =>
  useQuery({ queryKey: crmKeys.record(object, id), queryFn: () => getRecord(object, id, includeArchived), retry: false })

export const useRecordHistory = (object: ObjectKey, id: string, enabled: boolean) =>
  useQuery({ queryKey: crmKeys.history(object, id), queryFn: () => getRecordHistory(object, id, 0, 50), enabled })

export const useAllFields = (object: ObjectKey) =>
  useQuery({ queryKey: crmKeys.fields(object, true), queryFn: () => getFields(object, true) })

export const useDeletedFields = (object: ObjectKey) =>
  useQuery({ queryKey: crmKeys.deletedFields(object), queryFn: () => getDeletedFields(object) })

/** After a save, the record's cache holds the server's answer and every list of the type reloads. */
export function useRecordWrites(object: ObjectKey) {
  const qc = useQueryClient()
  const settle = useCallback(
    (r: RecordDetail) => {
      qc.setQueryData(crmKeys.record(object, r.id), r)
      void qc.invalidateQueries({ queryKey: crmKeys.searchAll(object) })
      void qc.invalidateQueries({ queryKey: crmKeys.history(object, r.id) })
    },
    [qc, object],
  )
  const create = useMutation({
    mutationFn: (p: { values: Values; recordFields?: DraftRecordField[]; duplicateReason?: string }) =>
      createRecord(object, p.values, p.recordFields ?? [], p.duplicateReason),
    onSuccess: settle,
  })
  const patch = useMutation({
    mutationFn: (p: { id: string; version: number; values: Values }) => patchRecord(object, p.id, p.version, p.values),
    onSuccess: settle,
  })
  return { create, patch, settle }
}

/** Entity links change both sides: the Person's Linked entities and the Entity's Linked persons. */
export function useLinkWrites() {
  const qc = useQueryClient()
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['crm', 'record'] })
    void qc.invalidateQueries({ queryKey: ['crm', 'history'] })
  }
  return {
    create: useMutation({ mutationFn: (l: LinkInput) => createLink(l), onSuccess: refresh }),
    update: useMutation({
      mutationFn: (p: { id: string; role: string; jobTitle?: string | null; department?: string | null; email?: string | null }) =>
        updateLink(p.id, p),
      onSuccess: refresh,
    }),
    primary: useMutation({ mutationFn: (id: string) => makeLinkPrimary(id), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => deleteLink(id), onSuccess: refresh }),
  }
}

/** Reloads everything that depends on field definitions (after Setup changes). */
export function useInvalidateConfig() {
  const qc = useQueryClient()
  return useCallback(() => qc.invalidateQueries({ queryKey: ['crm'] }), [qc])
}

export const useMetadata = () => useQuery({ queryKey: crmKeys.metadata, queryFn: getMetadata, staleTime: LONG })

export const useSections = (object: ObjectKey) =>
  useQuery({ queryKey: crmKeys.sections(object), queryFn: () => getSections(object) })

export const useAuditLog = (params: AuditParams, enabled = true) =>
  useQuery({ queryKey: crmKeys.audit(params), queryFn: () => getAuditLog(params), placeholderData: keepPreviousData, enabled })

/**
 * A record type with the labels set in Setup → Objects and fields (e.g. rename Person to Contact).
 * Falls back to the built-in labels until the metadata has loaded.
 */
export function useObjectInfo(object: ObjectKey): ObjectInfo {
  const metadata = useMetadata()
  const live = metadata.data?.objects?.[object]
  return useMemo(
    () => (live ? { ...OBJECTS[object], singular: live.label, plural: live.labelPlural } : OBJECTS[object]),
    [object, live],
  )
}
