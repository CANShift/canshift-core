type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

export type ExactOptional<T> = {
  [K in RequiredKeys<T>]: T[K]
} & {
  [K in OptionalKeys<T>]?: Exclude<T[K], undefined>
}
