import zlib,struct,sys
def load(f):
    d=open(f,'rb').read();i=8;idat=b'';w=h=0
    while i<len(d):
        l=struct.unpack('>I',d[i:i+4])[0];t=d[i+4:i+8];c=d[i+8:i+8+l]
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',c[:10])
        if t==b'IDAT': idat+=c
        i+=12+l
    raw=zlib.decompress(idat);bpp=4 if ct==6 else 3;st=w*bpp;out=bytearray();prev=bytearray(st);p=0
    for y in range(h):
        f=raw[p];p+=1;line=bytearray(raw[p:p+st]);p+=st
        for x in range(st):
            a=line[x-bpp] if x>=bpp else 0;b=prev[x];c=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pa=abs(b-c);pb=abs(a-c);pc=abs(a+b-2*c);pr=a if pa<=pb and pa<=pc else (b if pb<=pc else c);line[x]=(line[x]+pr)&255
        out+=line;prev=line
    return w,h,bpp,out
w,h,bpp,A=load(sys.argv[1]);_,_,_,B=load(sys.argv[2])
mx=0;xs=[];ys=[]
for i in range(len(A)):
    d=abs(A[i]-B[i])
    if d:
        p=i//bpp; xs.append(p%w); ys.append(p//w); mx=max(mx,d)
print('max',mx,'n',len(xs),(min(xs),max(xs),min(ys),max(ys)) if xs else '')
