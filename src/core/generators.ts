import dayjs from 'dayjs';


/**
 * Generate a file name with tokenized values. The following tokens are currently supported:
 * 
 * - %DATE% - replaces the token with a safe, consistent, sortable date string
 *
 * @export
 * @param {string} template
 * @returns {string}
 */
export function generateFileName(template: string): string {
  return template.replace('%DATE%', dayjs().format('YYYYMMDD-HHmmss'));
}
