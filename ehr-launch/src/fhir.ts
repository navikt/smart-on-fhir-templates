export interface PatientName {
    text?: string
    given?: string[]
    family?: string
}

export function displayName(patient: { name?: PatientName[] }): string {
    const name = patient.name?.[0]
    const joinedName = [...(name?.given ?? []), name?.family].filter(Boolean).join(' ')

    return name?.text || joinedName || 'Name unavailable'
}
