import NpmDependenciesObject from './NpmDependenciesObject'

export default interface NpmPackageManifest {
    name?: string
    version?: string
    versions?: string[]
    dependencies?: NpmDependenciesObject
    devDependencies?: NpmDependenciesObject
    peerDependencies?: NpmDependenciesObject
}
