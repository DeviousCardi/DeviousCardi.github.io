import { useEffect, useState } from 'react'
import { contactParts } from './content.js'

// Joins the contact details in the browser, after mount, so they never sit in
// the served HTML as plain text.
export function useContact() {
  const [contact, setContact] = useState(null)
  useEffect(() => {
    const email = contactParts.email.join('@')
    const [cc, a, b] = contactParts.phone
    setContact({
      email,
      mailto: `mailto:${email}`,
      phone: `${cc} ${a} ${b}`,
      tel: `tel:${cc}${a}${b}`,
    })
  }, [])
  return contact
}
