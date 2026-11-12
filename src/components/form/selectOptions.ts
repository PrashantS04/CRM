export interface SelectOption {
  value: string
  label: string
}

export type SelectOptions = readonly (string | SelectOption)[]

export const toOption = (option: string | SelectOption): SelectOption =>
  typeof option === 'string' ? { value: option, label: option } : option
