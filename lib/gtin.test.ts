import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gtinKey, gtinValid } from './gtin';

describe('gtinValid', () => {
  it('acepta EAN-13 reales con dígito verificador correcto', () => {
    assert.equal(gtinValid('4006381333931'), true); // el ejemplo EAN-13 de Wikipedia
    assert.equal(gtinValid('5449000000996'), true); // Coca-Cola 33 cl
  });

  it('acepta EAN-8', () => {
    assert.equal(gtinValid('96385074'), true);
    assert.equal(gtinValid('73513537'), true);
  });

  it('acepta UPC-A (12 dígitos) y GTIN-14', () => {
    assert.equal(gtinValid('036000291452'), true);
    assert.equal(gtinValid('00036000291452'), true);
  });

  it('rechaza un dígito verificador equivocado', () => {
    assert.equal(gtinValid('4006381333932'), false);
    assert.equal(gtinValid('5449000000990'), false);
    assert.equal(gtinValid('96385075'), false);
    assert.equal(gtinValid('036000291453'), false);
  });

  it('rechaza una lectura con un dígito cambiado', () => {
    // 4006381333931 con el 3.º dígito mal leído
    assert.equal(gtinValid('4096381333931'), false);
  });

  it('rechaza longitudes que no son de un GTIN', () => {
    assert.equal(gtinValid(''), false);
    assert.equal(gtinValid('1234567'), false); // 7
    assert.equal(gtinValid('123456789'), false); // 9
    assert.equal(gtinValid('12345678901'), false); // 11
    assert.equal(gtinValid('123456789012345'), false); // 15
  });

  it('rechaza lo que no son solo dígitos', () => {
    assert.equal(gtinValid('40063813339 1'), false);
    assert.equal(gtinValid('4006381333-31'), false);
    assert.equal(gtinValid('abcdefghijklm'), false);
    assert.equal(gtinValid('4006381333931\n'), false);
  });

  it('un UPC-A y su EAN-13 con cero inicial valen lo mismo', () => {
    assert.equal(gtinValid('036000291452'), gtinValid('0036000291452'));
  });
});

describe('gtinKey', () => {
  it('quita los ceros iniciales', () => {
    assert.equal(gtinKey('0036000291452'), '36000291452');
    assert.equal(gtinKey('036000291452'), '36000291452');
  });

  it('deja igual un código sin ceros iniciales', () => {
    assert.equal(gtinKey('4006381333931'), '4006381333931');
  });

  it('UPC-A y EAN-13 del mismo producto comparten clave', () => {
    assert.equal(gtinKey('036000291452'), gtinKey('0036000291452'));
  });

  it('no toca los ceros del medio ni del final', () => {
    assert.equal(gtinKey('5449000000996'), '5449000000996');
  });
});
