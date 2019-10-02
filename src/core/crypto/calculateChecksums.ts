import crypto from 'crypto';
import fs from 'fs';

type SupportedAlgorithm = 'md5' | 'sha1' | 'sha256'

type ChecksumResult = {
  [key in SupportedAlgorithm]?: string;
};

export default async function calculateChecksums(file: string, algorithms: SupportedAlgorithm[]): Promise<ChecksumResult> {
  return new Promise((resolve, reject) => {
    const hashes = algorithms.reduce((hashes, algorithm) => {
      hashes[algorithm] = crypto.createHash(algorithm);
      return hashes;
    }, {});

    const stream = fs.createReadStream(file);

    stream.on('data', data =>
      Object
        .keys(hashes)
        .forEach(algorithm => {
          const hash = hashes[algorithm];
          hash.update(data, 'utf8');
        })
    );

    stream.on('error', reject);

    stream.on('end', () => {
      const checksums: ChecksumResult = {};

      Object
        .keys(hashes)
        .forEach(algorithm => {
          const hash = hashes[algorithm];
          checksums[algorithm] = hash.digest('hex')
        });

      resolve(checksums);
    });
  });
}
