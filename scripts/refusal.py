"""A refusal ends this call. Guidance is text, never an executable repair plan."""
import argparse
import json


def halt(report, code=None):
    """Attach safe, condition-specific user guidance without echoing input values."""
    code = code or report.get('reason')
    if not code and report.get('context',{}).get('status') == 'REFUSED':
        code = report['context'].get('reason')
    subject = ''
    if not code and report.get('details'):
        detail = report['details'][0]
        code = detail.get('status') or 'required health check failed'
        subject = detail.get('binary','')
    if report.get('error_code') == 'ERR_TARGET_OUTSIDE_SANDBOX':
        code = 'TARGET_OUTSIDE'
    for item in report.get('capabilities', []):
        if item.get('status') == 'FAIL':
            code = item.get('reason', code)
            subject = item.get('capability', '')
            break
    for item in report.get('tools', []):
        if item.get('status') in ('INVALID_OVERRIDE', 'NOT_DISCOVERED', 'INSUFFICIENT_CONTRACT', 'FAIL'):
            code = item['status']
            subject = item.get('tool', '')
            break
    safe_subjects = {'python','node','java','javac','rustc','cargo','cl','git','gh','pwsh','bash','sh',
                     'typescript','react','vue','dotnet','cmake','ninja','msbuild','npm','npx'}
    label = subject if subject in safe_subjects else '当前条件'
    project = ('你选定的项目根目录及其 package.json；对应工具的官方文档',
               '手动核对该项目的实际依赖。使用 --project <含package.json的项目绝对目录> 或 DSHA_PROJECT_ROOT 指定项目；声明版本或写入 dependencies 不等于依赖可用。')
    paths = ('该工具的官方安装文档与本机工具路径配置',
             '手动核对实际可执行文件，用 --binary <工具名>=<可执行文件绝对路径> 或对应 DSHA_<工具名大写> 配置；无效覆盖不会回退。')
    choices = {
        'PROJECT_REQUIRED': ('未提供有效的项目根目录', *project),
        'PACKAGE_NOT_FOUND': ('未在所选项目中解析到必需依赖', *project),
        'OUTSIDE_PROJECT': ('依赖解析到了所选项目之外', '项目或工作区的依赖管理配置',
                            '由你确认实际拥有依赖的项目或工作区根，再用 --project 指定；不自动切换到父目录或全局包。'),
        'INVALID_OVERRIDE': ('显式工具位置无效', *paths),
        'NOT_DISCOVERED': ('未定位到必需工具，尚不能确认本机没有安装', *paths),
        'INSUFFICIENT_CONTRACT': ('当前工具缺少足够的身份检查契约', 'DSHA维护者及 docs/ENVFEEL.md',
                                  '请维护者补充受支持的身份和功能检查；不能用版本字符串替代验证。'),
        'SOURCE_IDENTITY': ('源码与已固定清单不一致', 'DSHA维护者及原始安装来源',
                            '由维护者核对提交、原始文件和清单；不要重算锁或重建哈希来消除差异。'),
        'PERMISSION_DENIED': ('当前授权条件不允许执行', '项目或系统授权负责人',
                              '由授权负责人确认许可；提高DSHA档位不能替代实际授权。'),
        'TARGET_OUTSIDE': ('目标不在已确认的允许范围内', '项目维护者及目标授权边界配置',
                           '由维护者确认目标与授权范围；不自动改目标、扩大白名单或更换启动器。'),
        'LAUNCHER_NOT_FOUND': ('未定位到已声明的启动器', 'DSHA维护者、工具索引及安装目录',
                               '由维护者手动核对索引cmd与已安装的脚本位置；不自动换启动器或下载安装。'),
        'INVALID_ARGUMENTS': ('调用参数无效', '当前命令的 --help 说明与私有配置',
                              '按 --help 手动修正参数；不在此输出原始参数值。'),
        'unsupported runtime OS/architecture combination': ('当前系统或架构不受支持', 'DSHA维护者及 docs/ENVFEEL.md',
                                                           '确认受支持的运行环境或请求适配；不伪造OS或架构变量。'),
        'undeclared or unsupported requirement': ('所需能力未声明或没有受支持的契约', 'DSHA维护者及命令的 --help',
                                                 '明确任务需要的能力；不自动替换工具、删去需求或尝试未知命令。'),
        'execution tool not declared': ('执行工具未在本次需求中声明', '当前任务的需求声明和 --help',
                                       '由你确认执行工具与 --require 声明；不自动增加或替换执行工具。'),
    }
    behavior = {'FAIL','PROBE_TIMEOUT','INVALID_REPLY','UNSUPPORTED_VERSION','IDENTITY','IDENTITY_CHANGED',
                'COMPILE','TYPECHECK','COMPILE_RUN','RENDER','REACTIVITY','FILE_LIMIT',
                'RESOLUTION_FAILED','BEHAVIOR_FAILED','required health check failed',
                'required MSVC linker/SDK activation failed','Rust host target contract unavailable'}
    if code in behavior:
        cause, destination, configuration = (
            '身份、版本、功能检查或响应时限未满足要求；不能据此断言工具未安装',
            '对应工具或项目的维护者，以及 docs/ENVFEEL.md 的支持范围',
            '请维护者核对版本、依赖、SDK及失败条件，再由你决定配置；不自动升级、安装、改配置或重试。')
    else:
        cause, destination, configuration = choices.get(code, (
            '环境或私有配置检查未通过，具体可用性尚未确认',
            'DSHA维护者及私有host配置／显式环境文件',
            '手动核对配置语法、绝对路径和支持范围；不自动修改文件、重算锁或再次探测。'))
    report['status'] = 'REFUSED'
    report.setdefault('task', {'status':'NOT_RUN'})
    report['stop'] = True
    report['user_response'] = {
        'apology': '抱歉，' + label + '不满足执行要求，本次任务已停止。',
        'execution_state': '后续任务未启动；此前已完成的探测以报告为准。' if report['task'].get('status') == 'NOT_RUN' else '任务执行状态以报告为准，不能声称未运行。',
        'condition': cause, 'where_to_check': destination,
        'manual_configuration': configuration,
        'automatic_actions': [],
        'resume': '仅在你处理后明确要求重新执行时，才开始新的调用。'}
    return report


class RefusalParser(argparse.ArgumentParser):
    def error(self, message):
        print(json.dumps(halt({'task':{'status':'NOT_RUN'}}, 'INVALID_ARGUMENTS'),ensure_ascii=True))
        raise SystemExit(2)
