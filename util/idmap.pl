#!/usr/bin/perl
use strict;
my $mapfile = shift @ARGV;
die "cat some.gff | $0 mapfile.csv" unless $mapfile;

my %map = ();
open(M, $mapfile) or die "couldn't open mapfile '$mapfile': $!";
while ( my $kv = <M> ) {
  chomp $kv;
  my ( $k, $v ) = split /\t/, $kv;
  $map{ $k } = $v;
}
close(M);

while ( my $line = <> ) {
  foreach my $k ( keys %map ) {
    my $v = $map{ $k };
    $line =~ s/$k/$v/g;
  }
  print $line;
}
