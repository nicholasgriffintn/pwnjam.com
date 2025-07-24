export const CHALLENGE_CATEGORIES = {
  web: 'Web Application Security',
  crypto: 'Cryptography',
  pwn: 'Binary Exploitation',
  reverse: 'Reverse Engineering',
  forensics: 'Digital Forensics',
  misc: 'Miscellaneous',
  steganography: 'Steganography',
  osint: 'Open Source Intelligence',
};

export const CHALLENGE_TEMPLATES = {
  web: [
    {
      type: 'xss',
      description: 'Find and exploit a Cross-Site Scripting vulnerability',
      basePrompt: 'Create a web challenge with an XSS vulnerability',
    },
    {
      type: 'sql_injection',
      description: 'Exploit a SQL injection vulnerability',
      basePrompt: 'Create a web challenge with SQL injection vulnerability',
    },
    {
      type: 'auth_bypass',
      description: 'Bypass authentication mechanisms',
      basePrompt: 'Create a web challenge requiring authentication bypass',
    },
  ],
  crypto: [
    {
      type: 'caesar_cipher',
      description: 'Decrypt a Caesar cipher',
      basePrompt: 'Create a cryptography challenge using Caesar cipher',
    },
    {
      type: 'rsa',
      description: 'Break weak RSA encryption',
      basePrompt: 'Create an RSA cryptography challenge',
    },
    {
      type: 'hash_cracking',
      description: 'Crack password hashes',
      basePrompt: 'Create a hash cracking challenge',
    },
  ],
  pwn: [
    {
      type: 'buffer_overflow',
      description: 'Exploit a buffer overflow vulnerability',
      basePrompt: 'Create a binary exploitation challenge with buffer overflow',
    },
    {
      type: 'format_string',
      description: 'Exploit format string vulnerabilities',
      basePrompt: 'Create a format string exploitation challenge',
    },
  ],
  reverse: [
    {
      type: 'basic_reversing',
      description: 'Reverse engineer a binary to find the flag',
      basePrompt: 'Create a reverse engineering challenge',
    },
    {
      type: 'obfuscation',
      description: 'Deobfuscate code to find the flag',
      basePrompt: 'Create an obfuscated code reversing challenge',
    },
  ],
  forensics: [
    {
      type: 'file_analysis',
      description: 'Analyze files to extract hidden information',
      basePrompt: 'Create a digital forensics file analysis challenge',
    },
    {
      type: 'network_analysis',
      description: 'Analyze network traffic for clues',
      basePrompt: 'Create a network forensics challenge',
    },
  ],
  misc: [
    {
      type: 'programming',
      description: 'Solve algorithmic programming challenges',
      basePrompt: 'Create a programming logic challenge',
    },
    {
      type: 'logic_puzzle',
      description: 'Solve logic puzzles and riddles',
      basePrompt: 'Create a logic puzzle challenge',
    },
  ],
};
