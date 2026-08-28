# Gen I fixture findings

The first supplied file was a valid 0x8000-byte international Gen I layout but empty. The second supplied file is also exactly 0x8000 bytes and differs from the first. It contains one stored record in Box 01 at the PKSM international box region (box header 0x4000, record data beginning at 0x4016) and one party record at 0x2F34. The active current-box copy at 0x30C0 also contains one record. This fixture is sufficient to begin Gen I record and box synchronization testing.

PKSM’s source-backed international layout is 12 boxes × 20 records, 33-byte box records, 44-byte party records, 11-byte Game Boy strings, current-box region 0x30C0, main checksum byte 0x3523, and bank checksum regions at 0x4000/0x6000. Export must recalculate these checksums after edits and preserve the 0x8000-byte file size.
