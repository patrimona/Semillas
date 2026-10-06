$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class SeedReader {
  static IntPtr context;
  [DllImport("winscard.dll")] static extern int SCardEstablishContext(uint scope, IntPtr a, IntPtr b, out IntPtr context);
  [DllImport("winscard.dll")] static extern int SCardIsValidContext(IntPtr context);
  [DllImport("winscard.dll")] static extern int SCardReleaseContext(IntPtr context);
  [DllImport("winscard.dll", CharSet=CharSet.Unicode)] static extern int SCardListReadersW(IntPtr context, string groups, byte[] readers, ref uint count);
  [DllImport("winscard.dll", CharSet=CharSet.Unicode)] static extern int SCardConnectW(IntPtr context, string reader, uint share, uint protocols, out IntPtr card, out uint protocol);
  [DllImport("winscard.dll")] static extern int SCardDisconnect(IntPtr card, uint disposition);
  [StructLayout(LayoutKind.Sequential)] struct IO { public uint protocol; public uint length; }
  [DllImport("winscard.dll")] static extern int SCardTransmit(IntPtr card, ref IO request, byte[] send, uint sendLength, IntPtr receiveRequest, byte[] receive, ref uint receiveLength);
  static void EnsureContext() {
    if (context != IntPtr.Zero && SCardIsValidContext(context)==0) return;
    if (context != IntPtr.Zero) SCardReleaseContext(context);
    int result=SCardEstablishContext(2,IntPtr.Zero,IntPtr.Zero,out context);
    if (result!=0) throw new Exception("Servicio de tarjetas inteligentes no disponible ("+result.ToString("X8")+").");
  }
  public static string[] Readers() {
    EnsureContext(); uint count=0;
    int result=SCardListReadersW(context,null,null,ref count);
    if (result==unchecked((int)0x8010002E)) return new string[0];
    if(result!=0) throw new Exception("No se pueden enumerar los lectores ("+result.ToString("X8")+").");
    byte[] buffer=new byte[count*2];
    result=SCardListReadersW(context,null,buffer,ref count);
    if(result!=0) throw new Exception("El lector se ha desconectado.");
    return Encoding.Unicode.GetString(buffer).Split(new char[]{'\0'},StringSplitOptions.RemoveEmptyEntries);
  }
  public static string Uid(string reader) {
    EnsureContext(); IntPtr card; uint protocol;
    int result=SCardConnectW(context,reader,2,3,out card,out protocol);
    if(result==unchecked((int)0x8010000C) || result==unchecked((int)0x80100069)) return null;
    if(result!=0) throw new Exception("No se puede conectar con la tarjeta ("+result.ToString("X8")+").");
    try {
      IO request=new IO { protocol=protocol, length=8 };
      byte[] command={0xFF,0xCA,0x00,0x00,0x00}; byte[] response=new byte[258]; uint length=258;
      result=SCardTransmit(card,ref request,command,5,IntPtr.Zero,response,ref length);
      if(result!=0) throw new Exception("No se puede leer el codigo de la tarjeta ("+result.ToString("X8")+").");
      if(length<3 || response[length-2]!=0x90 || response[length-1]!=0x00) throw new Exception("La tarjeta no proporciona un UID compatible.");
      return BitConverter.ToString(response,0,(int)length-2).Replace("-","");
    } finally { SCardDisconnect(card,0); }
  }
}
'@
function Send-Event($value) { [Console]::WriteLine(($value | ConvertTo-Json -Compress)) }
$previousUid = ''
$previousStatus = ''
while ($true) {
  try {
    $readers = @([SeedReader]::Readers() | Where-Object { $_ -match 'ACR1552' -and $_ -notmatch 'SAM' })
    $reader = $readers | Select-Object -First 1
    if (!$reader) {
      $message = 'Conecta el lector ACR1552U. Si no aparece, instala su controlador PC/SC.'
      $previousUid = ''
    } else {
      $message = 'Lector conectado: ' + $reader
      $uid = [SeedReader]::Uid($reader)
      if ($uid -and $uid -ne $previousUid) { Send-Event @{ type='tag'; uid=$uid; reader=$reader } }
      $previousUid = $uid
    }
    if ($message -ne $previousStatus) { Send-Event @{ type='status'; message=$message; connected=[bool]$reader }; $previousStatus=$message }
  } catch {
    $message = if ($_.Exception.InnerException) { $_.Exception.InnerException.Message } else { $_.Exception.Message }
    if ($message -match '8010001D') { $message = 'Conecta el ACR1552U y comprueba su controlador PC/SC. El servicio de tarjetas inteligentes de Windows no está disponible.' }
    if ($message -ne $previousStatus) { Send-Event @{ type='status'; message=$message; connected=$false }; $previousStatus=$message }
    $previousUid = ''
  }
  Start-Sleep -Milliseconds 350
}
