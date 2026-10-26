{
  pkgs,
  lib,
  config,
  ...
}:

{
  # devenv.sh/packages/
  packages = [
    pkgs.prisma
    pkgs.prisma-language-server
    pkgs.prisma_7
    pkgs.prisma-engines_7
    pkgs.nodejs
  ];

  # devenv.sh/languages/
  languages = {
    javascript.enable = true;
    javascript.pnpm.enable = true;
    # javascript.pnpm.install.enable = true;
  };

  # devenv.sh/services/
  services = {
    postgres = {
      enable = true;
    };
  };
}
